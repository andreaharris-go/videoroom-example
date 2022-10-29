import { createContext, useReducer } from "react";
import roomCtAction from "@/constants/roomCtAction";

const RoomContext = createContext();

const initialState = {
  myName: '',
  clients: [],
  clientId: '',
  sessions: [],
  sessionId: 0
};

const reducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return initialState;

    case roomCtAction.PUSH_CLIENTS:
      return {
        ...state,
        clients: [...state.clients, action.payload.clientId],
        clientId: action.payload.clientId,
      };

    case roomCtAction.SET_MY_NAME:
      return {
        ...state,
        myName: action.payload.myName
      };

    case roomCtAction.SET_SESSION_ATTACHED:
      const sessionId = action.payload.sessionId
      const sessionExist = state.sessions.filter((s) => s.length > 0 && s.sessionId === sessionId)

      if (!sessionExist?.length) {
        return {
          ...state,
          sessions: [...state.sessions, ...[{
            clientId: action.payload.clientId,
            sessionId: sessionId,
            server: action.payload.server,
          }]],
          sessionId: sessionId,
        };
      } else {
        return state;
      }
  }
};

function RoomContextProvider(props) {
  const [roomState, roomDispatch] = useReducer(reducer, initialState);
  const value = { roomState, roomDispatch };

  return (
    <RoomContext.Provider value={value}>{props.children}</RoomContext.Provider>
  );
}

const RoomContextConsumer = RoomContext.Consumer;

export { RoomContext, RoomContextProvider, RoomContextConsumer };
