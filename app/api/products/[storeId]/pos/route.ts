export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { searchParams } = new URL(_request.url);
    const search = searchParams.get("search") || "";
  } catch (e) {}
}
