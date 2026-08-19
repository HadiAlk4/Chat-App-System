import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-group-settings',
  imports: [FormsModule, RouterLink],
  templateUrl: './group-settings.html',
  styleUrl: './group-settings.css',
})
export class GroupSettings 
{

  userRole: string = 'group-admin';
  username: string = 'hadialk04';

  groupName: string = 'Sci-Fi Larpers';

  groupDescription: string = 'when ts not just intersteller and chess videos';

  groupMinAge: number = 10;

  groupThemeColor: string = 'blue'; 


  rooms: string[] = ['announcements', 'general-chat', 'wednesday larps'];

  addRoom(): void{
    const roomName = prompt("Enter New Room Name: ");
    if(roomName)
    {
    this.rooms.push(roomName);
    }
  }

  editRoom(index: number): void 
  {
    const currName = this.rooms[index];
    const newName = prompt('Edit Room Name: ', currName);
    if(newName)
    {
      this.rooms[index] = newName;
    }
  }

  deleteRoom(index: number): void
  {
    const targetRoom = this.rooms[index];
    if(confirm(`Are you sure you want to delete #${targetRoom}?`))
    {
      this.rooms.splice(index, 1);
    }
  }
}
