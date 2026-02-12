"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Power, PowerOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { deletePolicy, togglePolicyActive } from "@/actions/policies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Policy {
  id: string;
  name: string;
  description: string | null;
  effect: string;
  action: string;
  resourceType: string;
  priority: number;
  isActive: boolean;
  rules: Array<{
    id: string;
    attribute: string;
    operator: string;
    order: number;
    groupIndex: number | null;
  }>;
}

interface PolicyListProps {
  policies: Policy[];
}

export function PolicyList({ policies }: PolicyListProps) {
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDeletePolicy = async () => {
    if (!policyToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deletePolicy(policyToDelete.id);
      if (result.success) {
        toast({
          title: "Success",
          description: `Policy '${policyToDelete.name}' has been deleted`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete policy",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while deleting the policy",
      });
      console.error(err);
    } finally {
      setIsDeleting(false);
      setPolicyToDelete(null);
    }
  };

  const handleToggleActive = async (policy: Policy) => {
    setTogglingId(policy.id);
    try {
      const result = await togglePolicyActive(policy.id, !policy.isActive);
      if (result.success) {
        toast({
          title: "Success",
          description: `Policy ${policy.isActive ? "deactivated" : "activated"}`,
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update policy",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred",
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Card>
        <CardHeader>
          <CardTitle>Policy Management</CardTitle>
        </CardHeader>
        <CardContent>
          {policies.length === 0 ? (
            <div className="py-10 text-center">No policies found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Effect</TableHead>
                  <TableHead>Rules</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {policy.action}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {policy.resourceType}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          policy.effect === "ALLOW" ? "default" : "destructive"
                        }>
                        {policy.effect}
                      </Badge>
                    </TableCell>
                    <TableCell>{policy.rules.length}</TableCell>
                    <TableCell>
                      <Badge variant={policy.isActive ? "default" : "secondary"}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(policy)}
                          disabled={togglingId === policy.id}
                          title={
                            policy.isActive ? "Deactivate" : "Activate"
                          }>
                          {policy.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                          <span className="sr-only">
                            {policy.isActive ? "Deactivate" : "Activate"}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/policies/${policy.id}/edit`)
                          }>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPolicyToDelete(policy)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!policyToDelete}
        onOpenChange={(open) => !open && setPolicyToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the policy &quot;
              {policyToDelete?.name}&quot;? This will also delete all associated
              rules. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPolicyToDelete(null)}
              disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePolicy}
              disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
