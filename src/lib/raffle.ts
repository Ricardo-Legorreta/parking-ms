import type { IResident, IParkingSpot, RaffleEngineInput, RaffleEngineOutput, RaffleAssignment } from '@/types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function runRaffle(input: RaffleEngineInput): RaffleEngineOutput {
  const { participants, spots, blockedSpotsByResident } = input;

  const shuffled       = shuffle(participants);
  const availableSpots = spots.filter(s => s.isActive && !s.currentAssignment);
  const assignments: RaffleAssignment[] = [];
  const unassigned: IResident[]         = [];
  const assignedSpotIds = new Set<string>();

  for (const resident of shuffled) {
    const blockedIds = new Set(blockedSpotsByResident[resident._id] ?? []);
    const spot = availableSpots.find(s => !assignedSpotIds.has(s._id) && !blockedIds.has(s._id));
    if (spot) {
      assignments.push({ resident, spot });
      assignedSpotIds.add(spot._id);
    } else {
      unassigned.push(resident);
    }
  }

  return { assignments, unassigned };
}
