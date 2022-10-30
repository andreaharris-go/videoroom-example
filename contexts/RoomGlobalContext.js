import { createContext, useReducer } from "react";
import roomGlobalCtAction from "@/constants/roomGlobalCtAction";

const RoomGlobalContext = createContext();

const initialState = {
  roomId: 0,
  participantCount: 0,
  participants: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return initialState;

    case roomGlobalCtAction.SET_ROOM_ID:
      return {
        ...state,
        roomId: action.payload.roomId,
      };

    case roomGlobalCtAction.SET_PARTICIPANTS:
      return {
        ...state,
        participants: action.payload.participants,
      };

    case roomGlobalCtAction.SET_PARTICIPANT_COUNT:
      return {
        ...state,
        participantCount: action.payload.participantCount,
      };
  }
};

function RoomGlobalContextProvider(props) {
  const [roomGlobalState, roomGlobalDispatch] = useReducer(reducer, initialState);
  const value = { roomGlobalState, roomGlobalDispatch };

  return (
    <RoomGlobalContext.Provider value={value}>{props.children}</RoomGlobalContext.Provider>
  );
}

const RoomGlobalContextConsumer = RoomGlobalContext.Consumer;

export { RoomGlobalContext, RoomGlobalContextProvider, RoomGlobalContextConsumer };
