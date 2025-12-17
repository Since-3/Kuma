import { requireManager } from "@/src/lib/auth/getUser";
import RoomsCreateView from "@/src/modules/rooms/ui/views/rooms-create-view";

const RoomsCreate = async () => {
  await requireManager();
  return <RoomsCreateView />;
};

export default RoomsCreate;
