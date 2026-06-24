import { Suspense } from "react";
import { requireManagerOrPermission, isManager, isEmployee } from "@/src/lib/auth/getUser";
import { getMyRooms } from "@/src/modules/rooms/actions/room-actions";
import RoomsView from "@/src/modules/rooms/ui/views/rooms-view";
import RoomsLoading from "./loading";

const Rooms = async () => {
  const userData = await requireManagerOrPermission((p) => p.rooms.view);
  const canCreate =
    isManager(userData) || (isEmployee(userData) && userData.permissions.rooms.create);
  const canEdit = isManager(userData) || (isEmployee(userData) && userData.permissions.rooms.edit);
  const canDelete =
    isManager(userData) || (isEmployee(userData) && userData.permissions.rooms.delete);

  const result = await getMyRooms();
  const rooms = result.success ? result.rooms : [];

  return (
    <Suspense fallback={<RoomsLoading />}>
      <RoomsView rooms={rooms} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </Suspense>
  );
};

export default Rooms;
