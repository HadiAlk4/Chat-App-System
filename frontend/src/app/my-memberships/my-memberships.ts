import { Component } from '@angular/core';

@Component({
  selector: 'app-my-memberships',
  imports: [],
  templateUrl: './my-memberships.html',
  styleUrl: './my-memberships.css',
})
export class MyMemberships 
{

currentUsername: string = 'hadialk04';
currentUserRole: string = 'admin';

joinedGroups = [
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: true      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Digital Artists Collab',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.',
      role: 'member',
      themeColor: '#f1f8e9', 
      isSoleAdmin: false
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: false      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: true      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Digital Artists Collab',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.',
      role: 'member',
      themeColor: '#f1f8e9', 
      isSoleAdmin: false
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: false      // Because they are the sole admin, they cannot leave
    },{
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: true      // Because they are the sole admin, they cannot leave
    },
    {
      name: 'Digital Artists Collab',
      description: 'Share your digital drawings, ask for feedback, and collaborate on big canvas projects together.',
      role: 'member',
      themeColor: '#f1f8e9', 
      isSoleAdmin: false
    },
    {
      name: 'Sci-Fi Writers',
      description: 'A place for aspiring sci-fi authors to share snippets, world-build, and critique each other\'s work.',
      role: 'group-admin',
      themeColor: '#e0f7fa', 
      isSoleAdmin: false      // Because they are the sole admin, they cannot leave
    },

  ];
}
