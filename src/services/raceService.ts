
import { RaceDiscoveryService } from "./discovery/raceDiscoveryService";
import { RaceHostService } from "./host/raceHostService";
import { RaceImageService } from "./media/raceImageService";

// Re-export all services through a unified interface
export class RaceService {
  // Discovery methods
  static fetchAllRaces = RaceDiscoveryService.fetchAllRaces;

  // Host methods
  static fetchHostRaces = RaceHostService.fetchHostRaces;
  static createRace = RaceHostService.createRace;
  static updateRace = RaceHostService.updateRace;
  static deleteRace = RaceHostService.deleteRace;
  static getRaceStats = RaceHostService.getRaceStats;

  // Image methods
  static uploadRaceImage = RaceImageService.uploadRaceImage;
  static getRaceImages = RaceImageService.getRaceImages;
}
