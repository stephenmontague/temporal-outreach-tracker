import { ContactsPageClient } from "@/components/contact/ContactsPageClient";
import { getUserId } from "@/lib/constants";
import { serializeForClient } from "@/lib/utils";
import { SerializedContact } from "@/models/serialized";
import { ContactService } from "@/server/services/ContactService";

const contactService = new ContactService();

export default async function ContactsPage() {
     const userId = getUserId();
     const contactsRaw = await contactService.getAllContacts(userId);

     return <ContactsPageClient contacts={serializeForClient<SerializedContact[]>(contactsRaw)} />;
}
