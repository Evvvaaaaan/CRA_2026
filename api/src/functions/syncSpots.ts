import { app, InvocationContext, Timer } from "@azure/functions";
import { collectSpots } from "../services/collectSpots";
import { publishDataset } from "../services/spotStore";

export async function syncSpots(
  timer: Timer,
  context: InvocationContext,
): Promise<void> {
  context.log("클린 스팟 정기 수집 시작", { pastDue: timer.isPastDue });
  const { dataset, raw } = await collectSpots();
  await publishDataset(dataset, raw);
  context.log("클린 스팟 정기 수집 완료", {
    recordCount: dataset.metadata.recordCount,
    version: dataset.metadata.version,
  });
}

app.timer("syncSpots", {
  schedule: process.env.SPOTS_SYNC_SCHEDULE ?? "0 10 18 * * *",
  runOnStartup: false,
  handler: syncSpots,
});
