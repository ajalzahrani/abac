// @ts-nocheck
"use client";

import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/swtich";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  PolicyFormValues,
  policySchema,
  PolicyRuleFormValues,
  POLICY_RULE_OPERATORS,
  LOGICAL_OPERATORS,
  POLICY_EFFECTS,
} from "@/actions/policies.validation";
import {
  ATTRIBUTE_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
  ACTION_OPTIONS,
  VALUE_REFERENCE_OPTIONS,
} from "@/config/abac-options";
import { createPolicy, updatePolicy } from "@/actions/policies";

// Operators that need array values
const ARRAY_OPERATORS = ["in", "notIn"];
const NO_VALUE_OPERATORS = ["exists", "notExists"];

interface PolicyFormProps {
  policyId?: string;
  initialData?: Partial<PolicyFormValues>;
  submitLabel?: string;
}

export function PolicyForm({
  policyId,
  initialData,
  submitLabel = "Create Policy",
}: PolicyFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      effect: initialData?.effect ?? "ALLOW",
      action: initialData?.action ?? "",
      resourceType: initialData?.resourceType ?? "",
      priority: initialData?.priority ?? 100,
      isActive: initialData?.isActive ?? true,
      rules: initialData?.rules ?? [],
    } as PolicyFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rules",
  });

  const handleSubmit = async (data: PolicyFormValues) => {
    setError(null);
    try {
      const result = policyId
        ? await updatePolicy(policyId, data)
        : await createPolicy(data);
      if (result && result.success) {
        toast({
          title: "Success",
          description: "Policy saved successfully",
        });
        router.push("/policies");
      } else {
        const errMsg = result?.error || "Failed to save policy";
        setError(errMsg);
        toast({
          variant: "destructive",
          title: "Error",
          description: errMsg,
        });
      }
    } catch (err) {
      console.error("Policy form submit error:", err);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    }
  };

  const addRule = () => {
    const nextOrder = fields.length;
    append({
      attribute: "user.role",
      operator: "equals",
      value: "",
      logicalOperator: "AND",
      order: nextOrder,
      groupIndex: null,
      groupCombineOperator: null,
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Policy Information</CardTitle>
              <CardDescription>
                Define the policy name, effect, action, and resource type
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. View Users" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="action"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACTION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this policy allows or denies"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="effect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Effect</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POLICY_EFFECTS.map((e) => (
                            <SelectItem key={e} value={e}>
                              {e}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resourceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resource Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select resource type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RESOURCE_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority (lower = higher priority)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Inactive policies are not evaluated
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rules</CardTitle>
                  <CardDescription>
                    Define conditions. Use groups to build (A OR B) AND C
                    patterns. Rules in the same group are combined by the
                    logical operator.
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addRule}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
                  No rules. Add rules to define when this policy applies. A policy
                  with no rules applies to all requests.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <RuleRow
                      key={field.id}
                      index={index}
                      control={form.control as any}
                      onRemove={() => remove(index)}
                      isLast={index === fields.length - 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => router.push("/policies")}
              type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface RuleRowProps {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  onRemove: () => void;
  isLast: boolean;
}

function RuleRow({ index, control, onRemove, isLast }: RuleRowProps) {
  const operator = useWatch({ control, name: `rules.${index}.operator` });
  const needsArray = operator && ARRAY_OPERATORS.includes(operator);
  const needsNoValue = operator && NO_VALUE_OPERATORS.includes(operator);

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={control}
            name={`rules.${index}.attribute`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Attribute</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select attribute" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ATTRIBUTE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`rules.${index}.operator`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {POLICY_RULE_OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          {!needsNoValue && (
            <FormField
              control={control}
              name={`rules.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <ValueInput
                      value={field.value as string | number | (string | number)[] | null | undefined}
                      onChange={(v) => field.onChange(v as PolicyRuleFormValues["value"])}
                      needsArray={!!needsArray}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <FormField
            control={control}
            name={`rules.${index}.logicalOperator`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Combine with next (AND/OR)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? "AND"}
                  defaultValue={field.value ?? "AND"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LOGICAL_OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {op}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="mt-8">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove rule</span>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`rules.${index}.groupIndex`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group Index (optional)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder="Rules with same index form a group"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v === "" ? null : parseInt(v));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`rules.${index}.groupCombineOperator`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Group combine with next (optional)</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "__none__" ? null : v)}
                value={field.value ?? "__none__"}
                defaultValue={field.value ?? "__none__"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Leave empty to use rule operator" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="__none__">—</SelectItem>
                  {LOGICAL_OPERATORS.map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function ValueInput({
  value,
  onChange,
  needsArray,
}: {
  value: string | number | (string | number)[] | null | undefined;
  onChange: (v: string | number | (string | number)[] | null) => void;
  needsArray: boolean;
}) {
  if (needsArray) {
    const str =
      Array.isArray(value) ? value.join(", ") : String(value ?? "");
    return (
      <Input
        placeholder='e.g. ADMIN, AUDITOR or "DRAFT", "REJECTED"'
        value={str}
        onChange={(e) => {
          const parts = e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          onChange(parts);
        }}
      />
    );
  }
  const str = value != null ? String(value) : "";
  return (
    <Input
      placeholder="Value or attribute (e.g. resource.createdBy)"
      value={str}
      onChange={(e) => onChange(e.target.value || null)}
    />
  );
}
