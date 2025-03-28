import React, { useState, useCallback } from "react";
import {
  ChakraProvider,
  Container,
  VStack,
  Heading,
  Text,
  Box,
  Flex,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Progress,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { FaFileUpload, FaCheckCircle, FaTimesCircle, FaTrash } from "react-icons/fa";
import axios from "axios";

function AiResumeScreening() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumes, setResumes] = useState([]);
  const [rankedResumes, setRankedResumes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Handle file selection with validation
  const handleFileChange = useCallback((event) => {
    const files = event.target.files;
    if (files) {
      const validResumes = Array.from(files).filter(file => 
        file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024 // 5MB limit
      );

      if (validResumes.length !== files.length) {
        toast({
          title: "Invalid Files",
          description: "Only PDF files under 5MB are allowed.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      }

      setResumes(validResumes);
    }
  }, [toast]);

  // Remove a specific resume from the list
  const removeResume = useCallback((index) => {
    const updatedResumes = [...resumes];
    updatedResumes.splice(index, 1);
    setResumes(updatedResumes);
  }, [resumes]);

  // Handle API call with enhanced error handling
  const handleSubmit = async () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Missing Job Description",
        description: "Please provide a detailed job description.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (resumes.length === 0) {
      toast({
        title: "No Resumes",
        description: "Please upload at least one resume.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    resumes.forEach(resume => formData.append("resumes", resume));

    try {
      setIsLoading(true);
      const response = await axios.post("http://127.0.0.1:5000/match_resumes", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000 // 30 seconds timeout
      });

      const rankedResults = response.data.ranked_resumes.map(
        ([filename, score, matchedSkills]) => ({
          filename,
          score,
          matchedSkills
        })
      );

      setRankedResumes(rankedResults);
      toast({
        title: "Analysis Complete",
        description: `Ranked ${rankedResults.length} resumes successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Resume processing error:", error);
      toast({
        title: "Processing Failed",
        description: "Unable to process resumes. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <Container maxW="container.xl" py={10}>
        <VStack spacing={6} align="stretch">
          <Heading textAlign="center" mb={6}>AI Resume Screening</Heading>
          
          <FormControl>
            <FormLabel>Job Description</FormLabel>
            <Textarea
              placeholder="Paste the detailed job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              minHeight="150px"
              mb={4}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Upload Resumes</FormLabel>
            <Flex 
              border="2px dashed" 
              borderColor="gray.300" 
              p={4} 
              alignItems="center" 
              justifyContent="center"
              flexDirection="column"
            >
              <Input 
                type="file" 
                multiple 
                accept=".pdf" 
                onChange={handleFileChange}
                position="absolute"
                opacity={0}
                width="100%"
                height="100%"
                cursor="pointer"
              />
              <Flex alignItems="center">
                <Icon as={FaFileUpload} mr={2} />
                <Text>Click or drag PDF files here</Text>
              </Flex>
            </Flex>

            {resumes.length > 0 && (
              <VStack align="stretch" mt={4} spacing={2}>
                {resumes.map((file, index) => (
                  <Flex 
                    key={file.name} 
                    justify="space-between" 
                    align="center" 
                    bg="gray.100" 
                    p={2} 
                    borderRadius="md"
                    boxShadow="sm"
                  >
                    <Text fontSize="sm">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</Text>
                    <Button 
                      size="xs" 
                      colorScheme="red" 
                      onClick={() => removeResume(index)}
                      leftIcon={<FaTrash />}
                    >
                      Remove
                    </Button>
                  </Flex>
                ))}
              </VStack>
            )}
          </FormControl>

          <Button 
            colorScheme="blue" 
            onClick={handleSubmit} 
            isLoading={isLoading}
            loadingText="Processing"
            width="full"
          >
            Analyze Resumes
          </Button>

          <Divider my={6} height={2} color={"black"}/>

          {isLoading && <Progress size="sm" isIndeterminate />}

          {rankedResumes.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>Ranked Resumes</Heading>
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Rank</Th>
                      <Th>Filename</Th>
                      <Th>Match Score</Th>
                      <Th>Matched Skills</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rankedResumes.map((resume, index) => (
                      <Tr key={resume.filename}>
                        <Td>{index + 1}</Td>
                        <Td>{resume.filename}</Td>
                        <Td>
                          <Flex align="center">
                            {resume.score.toFixed(2)}
                            <Icon 
                              ml={2} 
                              color={resume.score > 0.7 ? "green.500" : "yellow.500"}
                              as={resume.score > 0.7 ? FaCheckCircle : FaTimesCircle} 
                            />
                          </Flex>
                        </Td>
                        <Td>
                          <Text noOfLines={2}>
                            {resume.matchedSkills?.join(", ") || "No specific skills matched"}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default AiResumeScreening;
