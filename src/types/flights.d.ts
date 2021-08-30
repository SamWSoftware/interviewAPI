export interface Flight {
    id: string;
    pk: string;
    sk: string;
    origin: string;
    destination: string;
    departureDate: number;
    passengers: Passenger[];
}

export type Passenger = any;
