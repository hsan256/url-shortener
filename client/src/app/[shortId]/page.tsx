/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";

export default function RedirectPage({ params }: { params: Promise<{ shortId: string }> }) {
  const router = useRouter();
  const { shortId } = use(params);


  useEffect(() => {
    const redirect = async () => {
      try {
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/${shortId}`);
        window.location.href = data.originalUrl;
      } catch (error) {
        router.push("/");
      }
    };
    redirect();
  }, [router, shortId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin" />
      <p className="mt-4 text-lg">Redirecting to your destination...</p>
    </div>
  );
}
