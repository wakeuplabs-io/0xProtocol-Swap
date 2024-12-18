import { type NextRequest } from "next/server";
// import qs from "qs";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const tradeHash = searchParams.get("tradeHash");
        const res = await fetch(
            `http://api.0x.org/gasless/status/${tradeHash}?chainId=${searchParams.get("chainId")}`,
            {
                headers: {
                    "0x-api-key": process.env
                        .NEXT_PUBLIC_ZEROEX_API_KEY as string,
                    "0x-version": "v2",
                    "Content-Type": "application/json",
                },
            }
        );

        const data = await res.json();
        if (!res.ok) {
            return new Response(JSON.stringify(data), { status: res.status });
        }
        return Response.json(data);
    } catch (error: any) {
        console.log(error);
        return new Response(error.message, { status: 500 });
    }
}
