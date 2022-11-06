import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import { DatePipe } from '@angular/common';
import { AngularFireDatabase } from '@angular/fire/compat/database';

export const snapshotToArray = (snapshot: any) => {
  const returnArr = [];

  snapshot.forEach((childSnapshot: any) => {
      const item = childSnapshot.val();
      item.key = childSnapshot.key;
      returnArr.push(item);
  });

  return returnArr;
};

@Component({
  selector: 'app-roomlist',
  templateUrl: './roomlist.component.html',
  styleUrls: ['./roomlist.component.scss']
})
export class RoomlistComponent implements OnInit {
  nickname = '';
  displayedColumns: string[] = ['roomname'];
  rooms = [];
  isLoadingResults = true;

  ref = this.afsData.database.ref('roomusers/');

  constructor(private route: ActivatedRoute, private router: Router, public datepipe: DatePipe,
    public afsData: AngularFireDatabase) {
    this.nickname = localStorage.getItem('nickname');
    this.afsData.database.ref('rooms/').on('value', resp => {
      this.rooms = [];
      this.rooms = snapshotToArray(resp);
      this.isLoadingResults = false;
    });
  }

  ngOnInit(): void {
  }

  enterChatRoom(roomname: string) {
    const chat = { roomname: '', nickname: '', message: '', date: '', type: '' };
    chat.roomname = roomname;
    chat.nickname = this.nickname;
    chat.date = this.datepipe.transform(new Date(), 'dd/MM/yyyy HH:mm:ss');
    chat.message = `${this.nickname} enter the room`;
    chat.type = 'join';
    const newMessage = this.afsData.database.ref('chats/').push();
    newMessage.set(chat);

    //
    console.log(this.ref.orderByChild('roomname'))
    console.log(roomname)
    console.log()

    //

    this.ref.orderByChild('roomname').equalTo(roomname).on('value', (resp: any) => {
      let roomuser = [];
   
      roomuser = snapshotToArray(resp);
      const user = roomuser.find(x => x.nickname === this.nickname);
      if (user !== undefined) {
        const userRef = this.afsData.database.ref('roomusers/' + user.key);
        userRef.update({status: 'online'});
      } else {
        const newroomuser = { roomname: '', nickname: '', status: '' };
        newroomuser.roomname = roomname;
        newroomuser.nickname = this.nickname;
        newroomuser.status = 'online';
        const newRoomUser = this.afsData.database.ref('roomusers/').push();
        newRoomUser.set(newroomuser);
      }
      console.log(roomuser)
    });
    console.log(roomname + 'später');
    console.log(this.nickname + 'später');
  
    
    // this.router.navigate(['/chatroom', roomname]);
    this.router.navigate(['/chatroom', roomname]);
    // this.router.navigateByUrl('/chatroom/' + this.nickname + '/' + roomname );

    console.log(this.nickname + 'noch später');
  }

  logout(): void {
    localStorage.removeItem('nickname');
    this.router.navigate(['/login']);
  }

}
