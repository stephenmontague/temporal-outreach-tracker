"use client";

import { deleteContact } from "@/app/actions/contact-actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteContactButtonProps {
     contactId: string;
     contactName: string;
}

export function DeleteContactButton({
     contactId,
     contactName,
}: DeleteContactButtonProps) {
     const router = useRouter();
     const [isDeleting, setIsDeleting] = useState(false);
     const [showConfirm, setShowConfirm] = useState(false);

     const handleDelete = async () => {
          setIsDeleting(true);
          try {
               const result = await deleteContact(contactId);
               if (result.success) {
                    router.push("/dashboard/contacts");
               } else {
                    alert(result.error || "Failed to delete contact");
               }
          } catch (error) {
               alert("Failed to delete contact");
          } finally {
               setIsDeleting(false);
               setShowConfirm(false);
          }
     };

     if (showConfirm) {
          return (
               <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                         Delete {contactName}?
                    </span>
                    <Button
                         variant="destructive"
                         size="sm"
                         onClick={handleDelete}
                         disabled={isDeleting}
                    >
                         {isDeleting ? "Deleting..." : "Yes, delete"}
                    </Button>
                    <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setShowConfirm(false)}
                         disabled={isDeleting}
                    >
                         Cancel
                    </Button>
               </div>
          );
     }

     return (
          <Button
               variant="ghost"
               size="sm"
               onClick={() => setShowConfirm(true)}
               className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
               <Trash2 className="h-4 w-4 mr-2" />
               Delete
          </Button>
     );
}

