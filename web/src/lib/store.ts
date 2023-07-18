'use client'

import { atom } from 'jotai'
import { ClientType, Drawing, GamerChoice, IClientTypeDTO, IGameState, IResultsSTG, Stage } from './schemas';
import { Results } from '@/app/game/layout';
import { get } from 'http';

const initUser: IClientTypeDTO = {
    id: 0,
    ctype: ClientType.Unknown,
    gamerId: 0,
}

export const userStateAtom = atom(initUser);
export const gameStateAtom = atom<null | IGameState>(null);
export const resultsAtom = atom<null | Results>(null);


export const getAudienceFromGameState = (gs: IGameState): number => {
    // Array.from gives the best types as opposed to Object.values
    return Array.from(gs.clients).filter((c) => c[1] === ClientType.Audience).length;
}

export const audienceCountAtom = atom((get) => {
    const gs = get(gameStateAtom);
    if (!gs) return 0;
    return getAudienceFromGameState(gs);
});
