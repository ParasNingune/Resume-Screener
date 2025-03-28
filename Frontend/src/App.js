import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import AiResumeScreening from "./AiResumeScreening";

function App() {
  return (
    <ChakraProvider>
      <AiResumeScreening />
    </ChakraProvider>
  );
}

export default App;