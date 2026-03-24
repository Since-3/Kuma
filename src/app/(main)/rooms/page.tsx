import { requireManagerOrPermission, isManager, isEmployee } from "@/src/lib/auth/getUser";
import RoomsView from "@/src/modules/rooms/ui/views/rooms-view";

const Rooms = async () => {
  const userData = await requireManagerOrPermission((p) => p.rooms.view);
  const canCreate =
    isManager(userData) || (isEmployee(userData) && userData.permissions.rooms.create);
  const canEdit = isManager(userData) || (isEmployee(userData) && userData.permissions.rooms.edit);
  const canDelete =
    isManager(userData) || (isEmployee(userData) && userData.permissions.rooms.delete);
  return <RoomsView canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />;
};

export default Rooms;
