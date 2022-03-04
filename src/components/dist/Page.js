"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var react_1 = require("react");
var Sidebar_1 = require("./Sidebar");
var react_2 = require("react");
var render_1 = require("../webgpu/render");
var rainbow_png_1 = require("./rainbow.png");
var rainbow2_png_1 = require("./rainbow2.png");
var react_bootstrap_1 = require("react-bootstrap");
var react_select_1 = require("react-select");
function importAll(r) {
    var images = {};
    r.keys().map(function (item, index) { images[item.replace('./', '').replace('.png', '')] = r(item); });
    return images;
}
var colormaps = importAll(require.context('../colormaps', false, /\.(png|jpe?g|svg)$/));
var colormap_list = ['magma', 'inferno', 'plasma', 'viridis', 'cividis', 'twilight', 'twilight_shifted', 'turbo', 'Blues', 'BrBG', 'BuGn', 'BuPu', 'CMRmap', 'GnBu', 'Greens', 'Greys', 'OrRd', 'Oranges', 'PRGn', 'PiYG', 'PuBu', 'PuBuGn', 'PuOr', 'PuRd', 'Purples', 'RdBu', 'RdGy', 'RdPu', 'RdYlBu', 'RdYlGn', 'Reds', 'Spectral', 'Wistia', 'YlGn', 'YlGnBu', 'YlOrBr', 'YlOrRd', 'afmhot', 'autumn', 'binary', 'bone', 'brg', 'bwr', 'cool', 'coolwarm', 'copper', 'cubehelix', 'flag', 'gist_earth', 'gist_gray', 'gist_heat', 'gist_ncar', 'gist_rainbow', 'gist_stern', 'gist_yarg', 'gnuplot', 'gnuplot2', 'gray', 'hot', 'hsv', 'jet', 'nipy_spectral', 'ocean', 'pink', 'prism', 'rainbow', 'seismic', 'spring', 'summer', 'terrain', 'winter', 'Accent', 'Dark2', 'Paired', 'Pastel1', 'Pastel2', 'Set1', 'Set2', 'Set3', 'tab10', 'tab20', 'tab20b', 'tab20c', 'magma_r', 'inferno_r', 'plasma_r', 'viridis_r', 'cividis_r', 'twilight_r', 'twilight_shifted_r', 'turbo_r', 'Blues_r', 'BrBG_r', 'BuGn_r', 'BuPu_r', 'CMRmap_r', 'GnBu_r', 'Greens_r', 'Greys_r', 'OrRd_r', 'Oranges_r', 'PRGn_r', 'PiYG_r', 'PuBu_r', 'PuBuGn_r', 'PuOr_r', 'PuRd_r', 'Purples_r', 'RdBu_r', 'RdGy_r', 'RdPu_r', 'RdYlBu_r', 'RdYlGn_r', 'Reds_r', 'Spectral_r', 'Wistia_r', 'YlGn_r', 'YlGnBu_r', 'YlOrBr_r', 'YlOrRd_r', 'afmhot_r', 'autumn_r', 'binary_r', 'bone_r', 'brg_r', 'bwr_r', 'cool_r', 'coolwarm_r', 'copper_r', 'cubehelix_r', 'flag_r', 'gist_earth_r', 'gist_gray_r', 'gist_heat_r', 'gist_ncar_r', 'gist_rainbow_r', 'gist_stern_r', 'gist_yarg_r', 'gnuplot_r', 'gnuplot2_r', 'gray_r', 'hot_r', 'hsv_r', 'jet_r', 'nipy_spectral_r', 'ocean_r', 'pink_r', 'prism_r', 'rainbow_r', 'seismic_r', 'spring_r', 'summer_r', 'terrain_r', 'winter_r', 'Accent_r', 'Dark2_r', 'Paired_r', 'Pastel1_r', 'Pastel2_r', 'Set1_r', 'Set2_r', 'Set3_r', 'tab10_r', 'tab20_r', 'tab20b_r', 'tab20c_r'];
console.log(colormaps['magma']["default"]);
console.log(rainbow_png_1["default"]);
var Page = /** @class */ (function (_super) {
    __extends(Page, _super);
    function Page(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            widthFactor: 1000,
            canvasRef: react_2.createRef(),
            outCanvasRef: react_2.createRef(),
            colorCanvasRef: react_2.createRef(),
            fpsRef: react_2.createRef(),
            iterRef: react_2.createRef(),
            colorValley: 45,
            colorHill: 90,
            colorMountain: 135,
            renderer: null
        };
        return _this;
    }
    Page.prototype.componentDidMount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adapter, device, colormapImage, imageBitmap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, navigator.gpu.requestAdapter()];
                    case 1:
                        adapter = (_a.sent());
                        console.log(adapter);
                        return [4 /*yield*/, adapter.requestDevice({
                                requiredLimits: {
                                    "maxStorageBufferBindingSize": adapter.limits.maxStorageBufferBindingSize
                                }
                            })];
                    case 2:
                        device = _a.sent();
                        colormapImage = new Image();
                        colormapImage.src = rainbow_png_1["default"];
                        return [4 /*yield*/, colormapImage.decode()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, createImageBitmap(colormapImage)];
                    case 4:
                        imageBitmap = _a.sent();
                        this.setState({ renderer: new render_1["default"](adapter, device, this.state.canvasRef, imageBitmap, colormapImage, this.state.outCanvasRef, this.state.fpsRef, this.state.iterRef)
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Page.prototype.setNodeEdgeData = function (nodeData, edgeData) {
        this.state.renderer.setNodeEdgeData(nodeData, edgeData);
    };
    Page.prototype.setWidthFactor = function (widthFactor) {
        this.state.renderer.setWidthFactor(widthFactor);
    };
    Page.prototype.setPeakValue = function (value) {
        this.state.renderer.setPeakValue(value);
    };
    Page.prototype.setValleyValue = function (value) {
        this.state.renderer.setValleyValue(value);
    };
    Page.prototype.setIdealLength = function (value) {
        this.state.renderer.setIdealLength(value);
    };
    Page.prototype.setCoolingFactor = function (value) {
        this.state.renderer.setCoolingFactor(value);
    };
    Page.prototype.setGlobalRange = function () {
        this.state.renderer.setGlobalRange();
    };
    Page.prototype.setColorValley = function (value) {
        this.setState({ colorValley: value });
        this.updateColormap();
    };
    Page.prototype.setColorHill = function (value) {
        this.setState({ colorHill: value });
        this.updateColormap();
    };
    Page.prototype.setColorMountain = function (value) {
        this.setState({ colorMountain: value });
        this.updateColormap();
    };
    Page.prototype.toggleNodeLayer = function () {
        this.state.renderer.toggleNodeLayer();
    };
    Page.prototype.toggleTerrainLayer = function () {
        this.state.renderer.toggleTerrainLayer();
    };
    Page.prototype.toggleEdgeLayer = function () {
        this.state.renderer.toggleEdgeLayer();
    };
    Page.prototype.updateColormap = function () {
        return __awaiter(this, void 0, void 0, function () {
            var colormapImage, colorCanvas, context, data, i, i, i, i, url, imageBitmap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        colormapImage = new Image();
                        colormapImage.src = rainbow2_png_1["default"];
                        return [4 /*yield*/, colormapImage.decode()];
                    case 1:
                        _a.sent();
                        colorCanvas = this.state.colorCanvasRef.current;
                        context = colorCanvas.getContext('2d');
                        context.drawImage(colormapImage, 0, 0);
                        data = context.getImageData(0, 0, 180, 1);
                        for (i = 0; i < this.state.colorValley; i++) {
                            data.data[i * 4] = 0;
                            data.data[i * 4 + 1] = 0 + (255 / this.state.colorValley) * i;
                            data.data[i * 4 + 2] = 255;
                            data.data[i * 4 + 3] = 255;
                        }
                        for (i = this.state.colorValley; i < this.state.colorHill; i++) {
                            data.data[i * 4] = 0;
                            data.data[i * 4 + 1] = 255;
                            data.data[i * 4 + 2] = 255 - (255 / (this.state.colorHill - this.state.colorValley)) * (i - this.state.colorValley);
                            data.data[i * 4 + 3] = 255;
                        }
                        for (i = this.state.colorHill; i < this.state.colorMountain; i++) {
                            data.data[i * 4] = 0 + (255 / (this.state.colorMountain - this.state.colorHill)) * (i - this.state.colorHill);
                            data.data[i * 4 + 1] = 255;
                            data.data[i * 4 + 2] = 0;
                            data.data[i * 4 + 3] = 255;
                        }
                        for (i = this.state.colorMountain; i < 180; i++) {
                            data.data[i * 4] = 255;
                            data.data[i * 4 + 1] = 255 - (255 / (180 - this.state.colorMountain)) * (i - this.state.colorMountain);
                            data.data[i * 4 + 2] = 0;
                            data.data[i * 4 + 3] = 255;
                        }
                        context.putImageData(data, 0, 0);
                        url = colorCanvas.toDataURL();
                        colormapImage.src = url;
                        return [4 /*yield*/, colormapImage.decode()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, createImageBitmap(colormapImage)];
                    case 3:
                        imageBitmap = _a.sent();
                        this.state.renderer.setColormap(imageBitmap, colormapImage);
                        return [2 /*return*/];
                }
            });
        });
    };
    Page.prototype.changeColormap = function (colormap) {
        return __awaiter(this, void 0, void 0, function () {
            var colormapImage, imageBitmap;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        colormapImage = new Image();
                        colormapImage.src = colormaps[colormap]["default"];
                        return [4 /*yield*/, colormapImage.decode()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, createImageBitmap(colormapImage)];
                    case 2:
                        imageBitmap = _a.sent();
                        this.state.renderer.setColormap(imageBitmap, colormapImage);
                        return [2 /*return*/];
                }
            });
        });
    };
    Page.prototype.runForceDirected = function () {
        this.state.renderer.runForceDirected();
    };
    Page.prototype.onSave = function () {
        this.state.renderer.onSave();
    };
    Page.prototype.render = function () {
        var _this = this;
        return (react_1["default"].createElement("div", { className: "main_wrapper" },
            react_1["default"].createElement(Sidebar_1["default"], { setValleyValue: this.setValleyValue.bind(this), setPeakValue: this.setPeakValue.bind(this), setWidthFactor: this.setWidthFactor.bind(this), setNodeEdgeData: this.setNodeEdgeData.bind(this), setGlobalRange: this.setGlobalRange.bind(this), setIdealLength: this.setIdealLength.bind(this), setCoolingFactor: this.setCoolingFactor.bind(this), toggleNodeLayer: this.toggleNodeLayer.bind(this), toggleTerrainLayer: this.toggleTerrainLayer.bind(this), toggleEdgeLayer: this.toggleEdgeLayer.bind(this), runForceDirected: this.runForceDirected.bind(this), setColorHill: this.setColorHill.bind(this), setColorValley: this.setColorValley.bind(this), setColorMountain: this.setColorMountain.bind(this), onSave: this.onSave.bind(this) }),
            react_1["default"].createElement("div", { className: "canvasContainer" },
                react_1["default"].createElement(react_select_1["default"], { className: "m-2", placeholder: "Choose colormap...", onChange: function (e) { return _this.changeColormap(e.value); }, options: colormap_list.map(function (cm) {
                        return { label: cm, value: cm };
                    }) }),
                react_1["default"].createElement(react_bootstrap_1.Form.Label, { className: "out", ref: this.state.fpsRef }, "FPS: n/a"),
                react_1["default"].createElement("br", null),
                react_1["default"].createElement(react_bootstrap_1.Form.Label, { className: "out", ref: this.state.iterRef }),
                react_1["default"].createElement("div", { id: "node_count" }),
                react_1["default"].createElement("div", { id: "graphDiv" },
                    react_1["default"].createElement("canvas", { id: "layoutCanvas" })),
                react_1["default"].createElement("canvas", { ref: this.state.canvasRef, width: 800, height: 800 }),
                react_1["default"].createElement("canvas", { hidden: true, ref: this.state.outCanvasRef, width: 800, height: 800 }),
                react_1["default"].createElement("canvas", { hidden: true, ref: this.state.colorCanvasRef, width: 180, height: 1 }))));
    };
    return Page;
}(react_1["default"].Component));
exports["default"] = Page;

//# sourceMappingURL=Page.js.map
