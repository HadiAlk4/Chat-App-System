export interface Group 
{
    id: number;
    groupName: string;
    groupDescription:string;
    minAge: number;
    themeColor: 'light' | 'dark';
    admins?: string[];
    members?: string[];
    rooms?: string[];
}
