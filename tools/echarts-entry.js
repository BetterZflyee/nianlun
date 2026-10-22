// The shipped ESM bundle contains only the chart and UI features used by Nianlun.
export { init, version } from "echarts/core";
import { use } from "echarts/core";
import { SankeyChart } from "echarts/charts";
import {
  TooltipComponent,
  ToolboxComponent,
  AriaComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
use([
  SankeyChart,
  TooltipComponent,
  ToolboxComponent,
  AriaComponent,
  SVGRenderer,
]);
