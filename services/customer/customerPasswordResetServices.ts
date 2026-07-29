import { CreateCusPasswordResetDto } from "@/dtos/customer.dto";
import {
  insertCusPasswordReset,
  selectCusPasswordReset,
  updateCusPasswordReset,
} from "@/models/customerPasswordResetModels";
import {
  selectCustomerAcconts,
  updateCustomerAccounts,
} from "@/models/customerModels";
import { CusPasswordReset } from "@/types/customer";
import { compareValue, hashValue } from "@/utils/bcrypt";
import { generatePasswordResetEmailHTML } from "@/utils/email-html";
import { generateVerificationCode } from "@/utils/generateVerificationCode";
import { sendEmail } from "@/utils/send-email";
import { PoolConnection } from "mysql2/promise";

const CODE_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 5;

// Generic on purpose — never reveals whether the code/account combination
// failed because the email doesn't exist, the code is wrong, or it expired.
// That distinction is exactly what an attacker probing for valid accounts
// would want, so every failure path in verify/reset collapses to this.
const INVALID_CODE_MESSAGE = "Invalid or expired code.";

export const sendPasswordResetEmail = async ({
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
    subject: "Reset your password",
    html: generatePasswordResetEmailHTML({ name, code }),
  });
};

const createResetCode = async ({
  cusAccId,
  connection,
}: {
  cusAccId: number;
  connection?: PoolConnection;
}) => {
  const previousUnused = await selectCusPasswordReset({
    keyFields: { cusAccId, isUsed: false },
    connection,
  });
  for (const row of previousUnused) {
    await updateCusPasswordReset({
      cusPassResetId: row.cusPassResetId,
      updateData: { isUsed: true },
      connection,
    });
  }

  const code = generateVerificationCode();
  const codeHash = await hashValue(code);
  const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  const data: CreateCusPasswordResetDto = {
    cusAccId,
    codeHash,
    expiresAt,
  };

  const cusPassResetId = await insertCusPasswordReset({ data, connection });

  return { cusPassResetId, code };
};

// Shared by verify() and reset() — both need to independently re-check the
// same code (reset() consumes it, verify() is a dry-run UX checkpoint), so
// the validation logic lives in one place.
const validateResetCode = async ({
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
    throw new Error(INVALID_CODE_MESSAGE);
  }

  const [latest] = await selectCusPasswordReset({
    keyFields: { cusAccId: account.cusAccId, isUsed: false },
    connection,
  });

  if (!latest) {
    throw new Error(INVALID_CODE_MESSAGE);
  }

  if (new Date(latest.expiresAt).getTime() < Date.now()) {
    throw new Error(INVALID_CODE_MESSAGE);
  }

  if (latest.attempts >= MAX_ATTEMPTS) {
    throw new Error(INVALID_CODE_MESSAGE);
  }

  const isMatch = await compareValue(code, latest.codeHash);

  if (!isMatch) {
    await updateCusPasswordReset({
      cusPassResetId: latest.cusPassResetId,
      updateData: { attempts: latest.attempts + 1 },
      connection,
    });
    throw new Error(INVALID_CODE_MESSAGE);
  }

  return { account, resetRow: latest as CusPasswordReset };
};

export const CustomerPasswordResetServices = {
  // Never throws for "account not found" — the caller (controller) always
  // reports the same generic success message regardless, so a client can't
  // use this endpoint to enumerate which emails have an account.
  request: async ({
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
      return;
    }

    const { code } = await createResetCode({
      cusAccId: account.cusAccId,
      connection,
    });

    await sendPasswordResetEmail({
      to: account.email,
      name: account.firstName,
      code,
    });
  },

  // Dry-run only — confirms the code is currently valid without consuming
  // it, so the UI can advance to the "set new password" step. The actual
  // reset() call re-validates independently before making any change.
  verify: async ({
    email,
    code,
    connection,
  }: {
    email: string;
    code: string;
    connection?: PoolConnection;
  }) => {
    await validateResetCode({ email, code, connection });
    return { email };
  },

  reset: async ({
    email,
    code,
    newPassword,
    connection,
  }: {
    email: string;
    code: string;
    newPassword: string;
    connection?: PoolConnection;
  }) => {
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const { account, resetRow } = await validateResetCode({
      email,
      code,
      connection,
    });

    const passwordHash = await hashValue(newPassword);
    const verifiedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await updateCusPasswordReset({
      cusPassResetId: resetRow.cusPassResetId,
      updateData: { isUsed: true, verifiedAt },
      connection,
    });
    await updateCustomerAccounts({
      cusAccId: account.cusAccId,
      updateData: { password: passwordHash },
      connection,
    });

    return { cusAccId: account.cusAccId, email: account.email };
  },
};
