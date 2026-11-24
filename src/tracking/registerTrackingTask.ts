import { AppState } from "react-native";
import type { LocationObject } from "expo-location";
import * as TaskManager from "expo-task-manager";
import { trackingTaskName } from "./constants";
import { handleLocations, resumeTracking } from "./engine";

if (!TaskManager.isTaskDefined(trackingTaskName))
  TaskManager.defineTask<{ locations?: LocationObject[] }>(
    trackingTaskName,
    async ({ data, error }) => {
      await handleLocations(data?.locations ?? [], Boolean(error));
    },
  );

AppState.addEventListener("change", (next) => {
  if (next === "active") void resumeTracking();
});

void resumeTracking();
