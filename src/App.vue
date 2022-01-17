<template>
  <div class="container">
    <div class="tool">
      <a-radio-group
        @change="handleMarkerTypeChange"
        v-model:value="markerType"
      >
        <a-radio-button value="Point">点</a-radio-button>
        <a-radio-button value="LineString">线</a-radio-button>
        <a-radio-button value="Polygon">多边形</a-radio-button>
      </a-radio-group>
      <a-button @click="test">log console</a-button>
    </div>

    <div class="map" id="map"></div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MarkerType, PointInfo } from ".";

let map: L.Map;
let moveTip: L.Marker;
let moveIcon: L.DivIcon = L.divIcon({
  className: "move-tip",
  html: "单击放置点,右击结束",
});
let dragMarkerId: number;
const markerType = ref<MarkerType>("Point");

const guid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const currentId = ref<number | string>(guid());
const pointMarkerInfo = new Map();
const polygonMarkerInfo = new Map();

const test = () => {
  console.log(pointMarkerInfo);
  console.log(polygonMarkerInfo);
};
const init = () => {
  map = L.map("map", {
    center: [39.909186, 116.397411],
    zoom: 10,
    minZoom: 3,
    maxZoom: 21,
    zoomControl: false,
    attributionControl: false,
  });
  const url =
    "http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}";
  L.tileLayer(url, {
    subdomains: "123",
  }).addTo(map);
  bindEvent();
};

const handleMarkerTypeChange = () => {
  handleDrawNew();
};

const getPointIcon = (color?: string) => {
  const blueColor = "#2D8CF0";
  const pointColor = color || blueColor;
  return L.divIcon({
    iconSize: [24, 24],
    className: "point-icon",
    html: `<div style="background-color:${pointColor};border-radius: 50%"></div>`,
  });
};

const bindEvent = () => {
  map
    .on("click", (e) => {
      if (markerType.value === "Point") {
        handleDrawNew();
      }
      const {
        latlng: { lat, lng },
      }: any = e;
      drawPoint({ lat, lng, type: markerType.value as any });
    })
    .on("contextmenu", (e) => {
      if (markerType.value !== "Point") {
        const {
          latlng: { lat, lng },
        }: any = e;
        drawPoint({ lat, lng, type: markerType.value as any });
        handleDrawNew();
      }
    })
    .on("dblclick", () => {})
    .on("mousemove", (e) => {
      if (moveTip) {
        const {
          latlng: { lat, lng },
        }: any = e;
        moveTip.setLatLng([lat, lng]);
      }
      // moveTip = L.marker([lat, lng], {
      //     icon: moveIcon,
      //   }).addTo(map);
    });
};

const handleDrawNew = () => {
  currentId.value = guid();
};

const drawPoint = (info: PointInfo) => {
  const {
    lat: lt,
    lng: lg,
    id = currentId.value,
    color = "#2D8CF0",
    name = "新建marker",
    type,
  } = info;
  const lat = Number(lt.toFixed(6));
  const lng = Number(lg.toFixed(6));
  const icon = getPointIcon(color);
  const marker = L.marker([lat, lng], {
    icon,
    draggable: true,
    zIndexOffset: 999,
  })
    .addTo(map)
    .on("click", (e) => {
      handleClickPoint(e);
    })
    .on("dragstart", (e) => {
      findDragPoint(e);
    })
    .on("drag", (e) => {
      pointsUpdate(e);
    })
    .on("dragend", () => {});
  const markerId = L.stamp(marker);
  const properties = {
    id,
    name,
    type,
    color,
  };
  pointMarkerInfo.set(markerId, { marker, properties });
  reDraw(type, id);
};

const drawLine = (id: number | string) => {
  let pointInfo;
  const points: any = [];
  pointMarkerInfo.forEach(({ marker, properties }) => {
    if (properties.id === id) {
      pointInfo = properties;
      const {
        _latlng: { lat, lng },
      } = marker;
      points.push([lat, lng]);
    }
  });
  if (polygonMarkerInfo.has(id)) {
    if (points.length === 0) {
      polygonMarkerInfo.delete(id);
    } else {
      const { marker } = polygonMarkerInfo.get(id);
      marker.setLatLngs(points);
    }
  } else {
    const marker = L.polyline(points, {
      color: "#2dbc9b",
      weight: 4,
    }).addTo(map);
    polygonMarkerInfo.set(id, { marker, properties: pointInfo });
  }
};

const drawPolygon = (id: number | string) => {
  let pointInfo;
  const points: any = [];
  pointMarkerInfo.forEach(({ marker, properties }) => {
    if (properties.id === id) {
      pointInfo = properties;
      const {
        _latlng: { lat, lng },
      } = marker;
      points.push([lat, lng]);
    }
  });
  if (polygonMarkerInfo.has(id)) {
    if (points.length === 0) {
      polygonMarkerInfo.delete(id);
    } else {
      const { marker } = polygonMarkerInfo.get(id);
      marker.setLatLngs(points);
    }
  } else {
    const marker = L.polygon(points, {
      color: "#1BBC9B",
      fillColor: "#1BBC9B",
      fillOpacity: 0.5,
      weight: 4,
      pane: "markerPane",
    }).addTo(map);
    polygonMarkerInfo.set(id, { marker, properties: pointInfo });
  }
};

const findDragPoint = (e: L.LeafletEvent) => {
  const id = L.stamp(e.target);
  if (pointMarkerInfo.has(id)) {
    dragMarkerId = id;
  } else {
    dragMarkerId = 0;
  }
};

const pointsUpdate = (e: L.LeafletEvent) => {
  if (dragMarkerId) {
    const { properties } = pointMarkerInfo.get(dragMarkerId);
    const { type, id } = properties;
    reDraw(type, id);
  }
};

const reDraw = (type: MarkerType, id: number | string) => {
  if (type === "LineString") {
    drawLine(id);
  }
  if (type === "Polygon") {
    drawPolygon(id);
  }
};

const handleClickPoint = (e: L.LeafletEvent) => {
  const markerId = L.stamp(e.target);
  const {
    marker,
    properties: { type, id },
  } = pointMarkerInfo.get(markerId);
  map.removeLayer(marker);
  pointMarkerInfo.delete(markerId);

  reDraw(type, id);
};

onMounted(() => {
  init();
});
</script>
<style lang="scss">
.point-icon {
  width: 20px !important;
  height: 20px !important;
  border: solid 2px #fff;
  border-radius: 50%;
  div {
    width: 100% !important;
    height: 100% !important;
    font-size: 12px;
    text-align: center;
    line-height: 20px;
    color: #fff;
  }
}
.move-tip {
  width: 160px !important;
  margin-left: 10px !important;
  margin-top: 20px !important;
  height: 24px !important;
  color: #000;
  font-size: 12px;
  line-height: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 1);
  border: 1px solid rgba(0, 0, 0, 0.85);
  border-radius: 2px;
}
</style>
<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100vh;
  position: relative;
  .tool {
    position: absolute;
    left: 20px;
    top: 20px;
    padding: 10px;
    background: #fff;
    z-index: 999;
    border-radius: 2px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  .map {
    width: 100%;
    height: 100%;
  }
}
</style>