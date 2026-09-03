import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth';

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

  constructor(private authService: AuthService) {}

  groupName: string = 'Sci-Fi Larpers';

  groupDescription: string = 'when ts not just intersteller and chess videos';

  groupMinAge: number = 10;

  groupThemeColor: string = 'Light'; 


  rooms: string[] = ['announcements', 'general-chat', 'wednesday larps'];

  onLogout(): void
  {
    this.authService.logout();
  }

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
  joinRequests = 
  [
    { username: 'NewbieDrawer123', requestedOn: 'July 30, 2026', rejectReason: '' }
  ];

  allowedMembers = 
  [
    { username: 'DaveAcs', role: 'user' },
    { username: 'Yo', role: 'user' }
  ];

  bannedMembers = 
  [
    { username: 'Tough Mudder' },
    { username: 'JFofh'}
  ];

  approveRequest(index: number): void 
  {
    const user = this.joinRequests[index];
    this.allowedMembers.push( { username: user.username, role: 'user'});
    this.joinRequests.splice(index, 1);
  }

  rejectRequest(index: number): void
  {
  const user = this.joinRequests[index]; 
  alert(`Rejected ${user.username}`);
  this.joinRequests.splice(index, 1);
  }

  promoteToGA(index: number): void
  {
  const user = this.allowedMembers[index].role = 'group-admin';
  }

  banMember(index: number): void
  {
  const user = this.allowedMembers[index];
  this.bannedMembers.push({ username: user.username });
  this.allowedMembers.splice(index, 1);
  const reason = prompt(`Enter ban reason for ${user.username} (sent to Super Admin):`);
  }

  unBanMember(index: number): void
  {
  const user = this.bannedMembers[index];
  this.allowedMembers.push({ username: user.username, role: 'user' });
  this.bannedMembers.splice(index, 1);
  }

  stepDownAsGA(): void {
    if (confirm('Are you sure you want to step down as Group Admin?')) {
      alert('You have stepped down.');
    }
  }

  requestGroupDeletion(): void 
  {
    const reason = prompt('Please enter a reason for the Super Admin:');
    if (reason) 
    {
      alert('Deletion request submitted to Super Admin.');
    }
  }
  
}
