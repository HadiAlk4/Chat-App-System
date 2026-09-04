export interface Group 
{
    _id?: string;
    groupName: string;
    groupDescription:string;
    minAge: number;
    themeColor: 'light' | 'dark';
    admins?: string[];
    members?: string[];
    rooms?: string[];
}
