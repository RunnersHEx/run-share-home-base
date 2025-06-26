
import { Map as MapIcon } from "lucide-react";

export const MapView = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">Vista de mapa en desarrollo</p>
        </div>
      </div>
    </div>
  );
};
