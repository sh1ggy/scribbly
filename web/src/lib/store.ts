'use client'

import { atom } from 'jotai'
import { ClientType, Drawing, GamerChoice, IClientTypeDTO, IGameState, IResultsSTG, Stage } from './schemas';
import { Results } from '@/app/game/layout';

const initUser: IClientTypeDTO = {
    id: 0,
    ctype: ClientType.Unknown,
    gamerId: 0,
}

export const userStateAtom = atom(initUser);
// Cant set through javascript, must be done in jsx so dont bother not using global window
export const gameStateAtom = atom<null | IGameState>(null);
export const resultsAtom = atom<null | Results>(null);