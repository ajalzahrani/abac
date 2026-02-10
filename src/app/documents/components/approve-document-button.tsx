"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { approveDocument } from "@/actions/documents";

export default function ApproveDocumentButton({
  documentId,
}: {
  documentId: string;
}) {
  const handleApprove = async () => {
    console.log("Approve");
    console.log(documentId);
    const res = await approveDocument(documentId);
    if (res?.success) {
      toast({
        title: "Success",
        description: "Document approved",
      });
    } else {
      toast({
        title: "Error",
        description: res?.error,
        variant: "destructive",
      });
      console.error(res);
    }
  };

  return <Button onClick={handleApprove}>Approve Document</Button>;
}
