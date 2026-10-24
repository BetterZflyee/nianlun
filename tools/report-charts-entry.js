export { init, version } from 'echarts/core';
import { use } from 'echarts/core';
import { GraphChart, BarChart, LineChart } from 'echarts/charts';
import { TooltipComponent, ToolboxComponent, LegendComponent, GridComponent, AriaComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
use([GraphChart, BarChart, LineChart, TooltipComponent, ToolboxComponent, LegendComponent, GridComponent, AriaComponent, SVGRenderer]);
