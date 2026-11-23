// Sends the live session's daily rows to the telemetry endpoint (roadmap 9.7). Step 0 stub: records nothing.
import type { Bus } from '../game/bus';
import type { Clock, SimHost, SimRole, Telemetry } from '../game/types';

export function createTelemetry(deps: { host: SimHost; bus: Bus; clock: Clock; getRole: () => SimRole; wsUrl: string }): Telemetry {
  return { record: (): void => { /* roadmap 9.7 */ }, flush: (): void => { /* roadmap 9.7 */ } };
}
