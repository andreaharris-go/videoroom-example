import {createContext, useReducer} from "react";

const UserContext = createContext();

const initialState = {
  displayName: "",
  imageUrl: "",
  uid: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "reset":
      return initialState;
    case "set-user":
      return {
        ...state,
        uid: action.payload.uid,
        displayName: action.payload.displayName,
        imageUrl: action.payload.imageUrl,
      };
  }
};

function UserContextProvider(props) {
  const [userState, userDispatch] = useReducer(reducer, initialState);
  const value = { userState, userDispatch };

  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  );
}

const UserContextConsumer = UserContext.Consumer;

export { UserContext, UserContextProvider, UserContextConsumer };
