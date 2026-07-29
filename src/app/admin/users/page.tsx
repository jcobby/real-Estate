"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { getAllUsers, toggleUserVerified } from "@/lib/api";
import { formatDate, initials } from "@/lib/format";
import type { Role } from "@/types";

const ROLE_STYLE: Record<Role, string> = {
  buyer: "bg-chart-3/20 text-foreground",
  seller: "bg-primary/20 text-accent-foreground dark:text-primary",
  provider: "bg-secondary/15 text-foreground",
  admin: "bg-secondary text-secondary-foreground",
};

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users, isPending } = useQuery({ queryKey: ["all-users"], queryFn: getAllUsers });

  const toggle = useMutation({
    mutationFn: (id: string) => toggleUserVerified(id),
    onSuccess: (verified) => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success(verified ? "User marked as identity-verified" : "Verification removed");
    },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">User management</h1>
      <p className="mt-1 text-sm text-muted-foreground">{users?.length ?? "…"} accounts on the platform.</p>

      <div className="mt-6">
        {isPending ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !users || users.length === 0 ? (
          <EmptyState icon={Users} title="No users" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">ID verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={u.avatarUrl} alt="" />
                          <AvatarFallback>{initials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-semibold">
                            <span className="truncate">{u.name}</span>
                            {u.verified && <BadgeCheck className="size-3.5 shrink-0 text-success" aria-label="Verified" />}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_STYLE[u.role]}>{u.role}</Badge>
                      {u.company && <p className="mt-0.5 max-w-40 truncate text-xs text-muted-foreground">{u.company}</p>}
                    </TableCell>
                    <TableCell className="text-sm">{u.region}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground">{formatDate(u.joinedAt)}</TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={u.verified}
                        disabled={toggle.isPending || u.role === "admin"}
                        onCheckedChange={() => toggle.mutate(u.id)}
                        aria-label={`Toggle identity verification for ${u.name}`}
                      />
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
