export type MarkerType = "Point" | "LineString" | "Polygon";
export type Feature = {
    id: string
    properties: {
        name: string;
        [key: string]: string | number;
    };
    geometry: {
        type: MarkerType;
        coordinates: any[];
    };
};
export type FeatureCollection = {
    collectionId?: string;
    features?: Feature[];
};

export type PointInfo = {
    id?: string;
    name?: string;
    color?: string;
    type: MarkerType
    lat: number;
    lng: number;
}