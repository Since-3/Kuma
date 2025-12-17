import { requireManager } from "@/src/lib/auth/getUser";
import RoomsView from "@/src/modules/rooms/ui/views/rooms-view";

const Rooms = async () => {
  await requireManager();
  return <RoomsView />;
};

export default Rooms;
