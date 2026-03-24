import { requireManagerOrPermission } from "@/src/lib/auth/getUser";
import RoomsCreateView from "@/src/modules/rooms/ui/views/rooms-create-view";

const RoomsCreate = async () => {
  await requireManagerOrPermission((p) => p.rooms.create);
  return <RoomsCreateView />;
};

export default RoomsCreate;
