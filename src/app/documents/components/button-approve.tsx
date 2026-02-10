"use client";

// import { approveDocument } from "@/actions/documents";
import { Button } from "@/components/ui/button";

export default function ButtonApprove({
  documentId,
  assignmentIds,
}: {
  documentId: string;
  assignmentIds: string[];
}) {

  // const handleApprove = async () => {
  //   console.log("Approve");
  //   console.log(documentId);
  //   const res = await approveDocument(documentId, assignmentIds);
  //   if (res?.success) {
  //     toast({
  //       title: "Success",
  //       description: "Document approved",
  //     });
  //   } else {
  //     toast({
  //       title: "Error",
  //       description: res?.error,
  //       variant: "destructive",
  //     });
  //     console.error(res);
  //   }
  // };

  return <Button>Approve Document</Button>;
}
