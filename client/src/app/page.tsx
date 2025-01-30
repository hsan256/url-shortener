/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
});

export default function Home() {
  const { toast } = useToast();
  const [result, setResult] = useState<{
    shortUrl: string;
    qrCode: string;
  } | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/shorten`, {
        originalUrl: values.url,
      });

      setResult(response.data);
      toast({
        title: 'URL Shortened!',
        description: 'Your link is ready to share',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to shorten URL',
        variant: 'destructive',
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-gray-800">
            Arcube URL Shortener
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-gray-700">
                Enter URL to shorten
              </Label>
              <Input
                id="url"
                placeholder="https://example.com"
                {...form.register('url')}
                className="focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              {form.formState.errors.url && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Shortening...' : 'Shorten URL'}
            </Button>
          </form>

          {result && (
            <div className="mt-8 space-y-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <Input
                  value={result.shortUrl}
                  readOnly
                  className="bg-gray-100 border-gray-200"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(result.shortUrl);
                    toast({ description: 'Copied to clipboard!' });
                  }}
                >
                  Copy
                </Button>
              </div>

              <div className="flex flex-col items-center">
                <QRCode
                  value={result.shortUrl}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#1e40af"
                  level="H"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Scan QR Code
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}