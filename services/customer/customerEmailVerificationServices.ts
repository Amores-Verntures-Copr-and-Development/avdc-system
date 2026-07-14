import { CreateCusEmailVerificationDto } from "@/dtos/customer.dto";
import {
  insertCusEmailVerification,
  selectCusEmailVerification,
  updateCusEmailVerification,
} from "@/models/customerEmailVerificationModels";
import {
  selectCustomerAcconts,
  updateCustomerAccounts,
} from "@/models/customerModels";
import { CusEmailVerification } from "@/types/customer";
import { compareValue, hashValue } from "@/utils/bcrypt";
import { generateVerificationEmailHTML } from "@/utils/email-html";
import { generateVerificationCode } from "@/utils/generateVerificationCode";
import { sendEmail } from "@/utils/send-email";
import { PoolConnection } from "mysql2/promise";

const CODE_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

export const sendVerificationCodeEmail = async ({
  to,
  name,
  code,
}: {
  to: string;
  name?: string | null;
  code: string;
}) => {
  return await sendEmail({
    to,
    subject: "Verify your email",
    html: generateVerificationEmailHTML({ name, code }),
  });
};

export const CusEmailVerificationServices = {
  get: async ({
    keyFields = {},
    connection,
  }: {
    keyFields?: Partial<Record<keyof CusEmailVerification, any>>;
    connection?: PoolConnection;
  }) => {
    return await selectCusEmailVerification({ keyFields, connection });
  },

  create: async ({
    cusAccId,
    connection,
  }: {
    cusAccId: number;
    connection?: PoolConnection;
  }) => {
    const previousUnused = await selectCusEmailVerification({
      keyFields: { cusAccId, isUsed: false },
      connection,
    });
    for (const row of previousUnused) {
      await updateCusEmailVerification({
        cusEmailVerId: row.cusEmailVerId,
        updateData: { isUsed: true },
        connection,
      });
    }

    const code = generateVerificationCode();
    const codeHash = await hashValue(code);
    const expiresAt = new Date(
      Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000,
    )
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const data: CreateCusEmailVerificationDto = {
      cusAccId,
      codeHash,
      expiresAt,
    };

    const cusEmailVerId = await insertCusEmailVerification({
      data,
      connection,
    });

    return { cusEmailVerId, code };
  },

  verify: async ({
    email,
    code,
    connection,
  }: {
    email: string;
    code: string;
    connection?: PoolConnection;
  }) => {
    const accounts = await selectCustomerAcconts({
      keyFields: { email },
      connection,
    });
    const account = accounts[0];
    if (!account) {
      throw new Error("Customer account not found.");
    }
    if (account.emailVerified) {
      throw new Error("Email is already verified.");
    }

    const [latest] = await selectCusEmailVerification({
      keyFields: { cusAccId: account.cusAccId, isUsed: false },
      connection,
    });

    if (!latest) {
      throw new Error("No active verification code — request a new one.");
    }

    if (new Date(latest.expiresAt).getTime() < Date.now()) {
      throw new Error("Verification code expired — request a new one.");
    }

    if (latest.attempts >= MAX_ATTEMPTS) {
      throw new Error("Too many attempts — request a new code.");
    }

    const isMatch = await compareValue(code, latest.codeHash);

    if (!isMatch) {
      await updateCusEmailVerification({
        cusEmailVerId: latest.cusEmailVerId,
        updateData: { attempts: latest.attempts + 1 },
        connection,
      });
      throw new Error("Invalid verification code.");
    }

    const verifiedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await updateCusEmailVerification({
      cusEmailVerId: latest.cusEmailVerId,
      updateData: { isUsed: true, verifiedAt },
      connection,
    });
    await updateCustomerAccounts({
      cusAccId: account.cusAccId,
      updateData: { emailVerified: true, emailVerifiedAt: verifiedAt },
      connection,
    });

    return {
      cusAccId: account.cusAccId,
      email: account.email,
    };
  },

  resend: async ({
    email,
    connection,
  }: {
    email: string;
    connection?: PoolConnection;
  }) => {
    const accounts = await selectCustomerAcconts({
      keyFields: { email },
      connection,
    });
    const account = accounts[0];
    if (!account) {
      throw new Error("Customer account not found.");
    }
    if (account.emailVerified) {
      throw new Error("Email is already verified.");
    }

    const { code } = await CusEmailVerificationServices.create({
      cusAccId: account.cusAccId,
      connection,
    });

    await sendVerificationCodeEmail({
      to: account.email,
      name: account.firstName,
      code,
    });

    return {
      cusAccId: account.cusAccId,
      email: account.email,
    };
  },
};
