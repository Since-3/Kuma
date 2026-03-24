import { requireManagerOrPermission } from "@/src/lib/auth/getUser";
import RoomsEditView from "@/src/modules/rooms/ui/views/rooms-edit-view";

const RoomsEdit = async ({ params }: { params: Promise<{ id: string }> }) => {
  await requireManagerOrPermission((p) => p.rooms.edit);
  const { id } = await params;
  return <RoomsEditView roomId={id} />;
};

export default RoomsEdit;
