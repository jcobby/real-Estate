"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { getSellerLeads, updateLeadStatus } from "@/lib/api";
import { useSession } from "@/stores/session";
import { initials, timeAgo } from "@/lib/format";
import type { Lead } from "@/types";

const KIND_LABEL: Record<Lead["kind"], string> = {
  message: "Message",
  "call-request": "Call request",
  offer: "Offer",
  "site-visit": "Site visit",
};

const STATUS_ITEMS = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "closed", label: "Closed" },
];

export default function SellerLeadsPage() {
  const { session } = useSession();
  const user = session!.user;
  const queryClient = useQueryClient();

  const { data: leads, isPending } = useQuery({
    queryKey: ["seller-leads", user.id],
    queryFn: () => getSellerLeads(user.id),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lead["status"] }) => updateLeadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-leads", user.id] });
      toast.success("Lead updated");
    },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Leads</h1>
      <p className="mt-1 text-sm text-muted-foreground">Every buyer signal across your listings.</p>

      <div className="mt-6">
        {isPending ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !leads || leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads yet"
            description="When buyers message, request calls or book site visits, they'll show up here."
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Listing</TableHead>
                  <TableHead>When</TableHead>
                  <TableHead className="w-40">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-9">
                          <AvatarImage src={lead.buyerAvatarUrl} alt="" />
                          <AvatarFallback>{initials(lead.buyerName)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-semibold">{lead.buyerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{KIND_LABEL[lead.kind]}</Badge>
                      {lead.note && <p className="mt-1 max-w-56 truncate text-xs text-muted-foreground">{lead.note}</p>}
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm">{lead.listingTitle}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{timeAgo(lead.createdAt)}</TableCell>
                    <TableCell>
                      <Select
                        items={STATUS_ITEMS}
                        value={lead.status}
                        onValueChange={(v) => setStatus.mutate({ id: lead.id, status: v as Lead["status"] })}
                      >
                        <SelectTrigger size="sm" className="w-36" aria-label={`Status for ${lead.buyerName}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ITEMS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
