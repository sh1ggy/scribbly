'use client'

import { atom } from 'jotai'
import { ClientType, IClientTypeDTO, IGameState, Stage } from './schemas';
import { Guid } from 'bebop';


const initGameState: IGameState = {
  id: Guid.newGuid(),
  stage: Stage.GamerSelect,
  clients: [],
  drawing: []
}

const initUser: IClientTypeDTO = {
    id: 0,
    ctype: ClientType.Unknown,
    gamerId: 0,
}

export const userStateAtom = atom(initUser);
// Cant set through javascript, must be done in jsx so dont bother not using global window
export const gameStateAtom = atom(initGameState);

