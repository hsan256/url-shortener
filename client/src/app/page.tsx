/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Mail, Pencil, Trash2 } from "lucide-react";
import QRCode from "qrcode.react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
});

interface Url {
  originalUrl: string;
  shortId: string;
  clicks: number;
  createdAt: string;
}

export default function Home() {
  const { toast } = useToast();
  const [result, setResult] = useState<{
    shortUrl: string;
    qrCode: string;
  } | null>(null);
  const [urls, setUrls] = useState<Url[]>([]);

  const [selectedUrl, setSelectedUrl] = useState<Url | null>(null);
  const [editableEmailTemplate, setEditableEmailTemplate] = useState("");

  const currentBaseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "" },
  });

  useEffect(() => {
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}`
      );
      setUrls(data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error fetching links" });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/shorten`,
        {
          originalUrl: values.url,
        }
      );
      setResult(response.data);
      await fetchUrls();
      toast({
        title: "URL Shortened!",
        description: "Your link is ready to share",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to shorten URL",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (shortId: string) => {
    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/${shortId}`
      );
      setUrls(urls.filter((url) => url.shortId !== shortId));
      toast({ description: "Link deleted successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error deleting link" });
    }
  };

  const handleEdit = async (shortId: string) => {
    const newShortId = prompt("Enter new custom URL (min 4 characters)");
    if (newShortId) {
      if (newShortId.length < 4) {
        return toast({
          variant: "destructive",
          title: "Invalid custom URL",
          description: "Must be at least 4 characters",
        });
      }

      try {
        const { data } = await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/${shortId}`,
          { shortId: newShortId }
        );
        setUrls(
          urls.map((url) =>
            url.shortId === shortId ? { ...url, shortId: data.shortId } : url
          )
        );
        toast({ description: "Custom URL updated successfully" });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        if (error.response?.data?.error) {
          toast({
            variant: "destructive",
            title: "Update failed",
            description: error.response.data.error,
          });
        } else {
          toast({ variant: "destructive", title: "Error updating URL" });
        }
      }
    }
  };

  const chartData = urls
    .map((url) => ({
      shortUrl: `${currentBaseUrl}/${url.shortId}`,
      clicks: url.clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  return (
    <main className="bg-gradient-to-br from-blue-50 to-white min-h-screen text-gray-900 transition-all duration-500">
      {/* Header */}
      <header className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-500">
              Arcube{" "}
            </span>
            URL Shortener
          </h1>
          <p className="mt-3 text-lg text-gray-600 sm:mt-4 sm:max-w-xl sm:mx-auto">
            Shorten, manage, and track your links effortlessly
          </p>
        </div>
      </header>

      {/* Shorten URL Card */}
      <div className="mx-auto mt-12 max-w-2xl px-4 sm:px-6 lg:px-8 mb-20">
        <Card className="overflow-hidden rounded-2xl border border-gray-200 shadow-xl">
          <CardHeader className="bg-gray-50 px-6 py-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Create Short Link
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label
                  htmlFor="url"
                  className="mb-1 text-sm font-medium text-gray-700"
                >
                  Destination URL
                </Label>
                <Input
                  id="url"
                  placeholder="https://yourlongurl.com/example"
                  {...form.register("url")}
                  className="mt-1 border-gray-200 bg-gray-50 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                />
                {form.formState.errors.url && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.url.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 py-2 text-sm font-medium text-white transition-colors duration-300 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Compressing..." : "Shorten URL"}
              </Button>
            </form>

            {/* Display new short URL + QR code */}
            {result && (
              <div className="space-y-6 border-t border-gray-200 pt-4 animate-fadeIn">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={result.shortUrl}
                    readOnly
                    className="flex-1 border-gray-200 bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(result.shortUrl);
                      toast({ description: "Copied to clipboard!" });
                    }}
                    className="sm:w-auto"
                  >
                    Copy
                  </Button>
                </div>
                <div className="rounded-lg border border-gray-100 p-4">
                  <div className="flex flex-col items-center gap-2">
                    <QRCode
                      value={result.shortUrl}
                      size={128}
                      bgColor="#ffffff"
                      fgColor="#1e40af"
                      level="H"
                      className="rounded border border-gray-100 p-2"
                    />
                    <span className="text-xs font-medium text-gray-500">
                      Scan QR Code
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Links Table */}
      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg border border-gray-200 shadow-lg">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                {[
                  "Original URL",
                  "Shortened",
                  "Clicks",
                  "Created",
                  "Actions",
                ].map((header) => (
                  <TableHead
                    key={header}
                    className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {urls.map((url) => {
                const shortUrl = `${currentBaseUrl}/${url.shortId}`;
                return (
                  <TableRow
                    key={url.shortId}
                    className="border-t border-gray-200 transition-colors duration-300 hover:bg-blue-50"
                  >
                    <TableCell className="max-w-[220px] truncate px-4 py-3 text-sm font-medium text-gray-900">
                      {url.originalUrl}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900">
                      {shortUrl}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900">
                      {url.clicks}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-500">
                      {new Date(url.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-1">
                        {/* EDIT */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(url.shortId)}
                          className="h-8 w-8 rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* DELETE */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(url.shortId)}
                          className="h-8 w-8 rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        {/* Email Template (Dialog) */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 rounded-lg p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100"
                              onClick={() => {
                                setSelectedUrl(url);
                                setEditableEmailTemplate(
                                  `Subject: Thank you for flying with us\n\nHello [Name],\n\nWe appreciate you choosing us for your travel needs. Please let us know how your flight experience was by visiting the following link:\n\n${shortUrl}\n\nAlternatively, you can scan the attached QR code to access the survey.\n\nWe look forward to serving you again soon!\n\nBest regards,\n[Airlines Name] Team`
                                );
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>

                          {selectedUrl?.shortId === url.shortId && (
                            <DialogPortal>
                              <DialogContent
                                className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border border-gray-200 bg-white p-6 shadow-2xl"
                                onEscapeKeyDown={() => setSelectedUrl(null)}
                                onPointerDownOutside={() =>
                                  setSelectedUrl(null)
                                }
                                onCloseAutoFocus={() => setSelectedUrl(null)}
                              >
                                <DialogHeader>
                                  <DialogTitle className="text-lg font-semibold">
                                    Email Template
                                  </DialogTitle>
                                  <DialogDescription className="text-sm text-gray-500">
                                    Modify and copy this template for your
                                    email.
                                  </DialogDescription>
                                </DialogHeader>

                                {/* Editable Email Template */}
                                <div className="mt-4 space-y-6">
                                  <Label className="mb-1 text-sm font-semibold">
                                    Email Template
                                  </Label>
                                  <textarea
                                    className="w-full h-44 rounded-md border border-gray-200 bg-gray-50 p-2 text-sm font-mono leading-5 focus:outline-none transition-all duration-300"
                                    value={editableEmailTemplate}
                                    onChange={(e) =>
                                      setEditableEmailTemplate(e.target.value)
                                    }
                                  />

                                  {/* Copy button */}
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        editableEmailTemplate
                                      );
                                      toast({
                                        description: "Email template copied!",
                                      });
                                    }}
                                  >
                                    Copy Email Template
                                  </Button>

                                  {/* Display QR Code */}
                                  <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 p-4">
                                    <QRCode
                                      value={shortUrl}
                                      size={128}
                                      bgColor="#ffffff"
                                      fgColor="#1e40af"
                                      level="H"
                                      className="rounded border border-gray-100 p-2"
                                    />
                                    <span className="text-xs font-medium text-gray-500">
                                      QR Code
                                    </span>
                                  </div>
                                </div>

                                <DialogFooter className="mt-6 flex justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedUrl(null)}
                                  >
                                    Close
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </DialogPortal>
                          )}
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {urls.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No shortened links yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Card */}
      <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <Card className="border border-gray-200 shadow-xl rounded-2xl">
          <CardHeader className="bg-gray-50 px-6 py-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Link Performance Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {urls.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="shortUrl"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280" }}
                      tickFormatter={(value) => {
                        const url = new URL(value);
                        return url.pathname.slice(1);
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280" }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      contentStyle={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value) => [value, "Clicks"]}
                    />
                    <Bar
                      dataKey="clicks"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      label={{ position: "top", fill: "#1e40af" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-gray-500">
                No click data available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
