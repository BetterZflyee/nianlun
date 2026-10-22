import { relaxLayout } from "./galaxy-model.js";
self.onmessage = ({ data }) => {
  const positions = relaxLayout(data.nodes, data.edges, data.mode);
  self.postMessage({ revision: data.revision, positions }, [positions.buffer]);
};
