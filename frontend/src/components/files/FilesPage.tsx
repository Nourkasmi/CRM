import React from "react";
import { Box } from "@mui/material";
import { FileManager } from "./FileManager";

const FilesPage: React.FC = () => {
  return (
    <Box>
      {/* File manager table */}
      <FileManager />
    </Box>
  );
};

export default FilesPage;