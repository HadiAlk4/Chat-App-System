import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { ChatMessage } from '../models/message';
import { ChatService } from '../services/chat';
import { GroupService } from '../services/group';
import { SocketService } from '../services/socket';
import { Chat } from './chat';

const history: ChatMessage[] = [
  {
    _id: '1',
    groupName: 'Readers',
    roomName: 'Main Room',
    senderUserName: 'bea',
    content: 'hello room',
    timestamp: new Date('2026-01-01T00:00:00.000Z'),
  },
];

describe('Chat', () => {
  let fixture: ComponentFixture<Chat>;
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    sessionStorage.setItem(
      'currentUser',
      JSON.stringify({ username: 'ada', email: 'ada@example.com', role: 'user' })
    );
    sendMessage = vi.fn();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({ groupName: 'Readers' }) } },
        {
          provide: ChatService,
          useValue: {
            sendMessage,
            joinRoom: vi.fn(),
            leaveRoom: vi.fn(),
            getRoomMessages: vi.fn(() => of(history)),
            emitDeleteMessage: vi.fn(),
            onNewMessage: () => EMPTY,
            onUserJoined: () => EMPTY,
            onUserLeft: () => EMPTY,
            onMessageDeleted: () => EMPTY,
            onRoomUsers: () => EMPTY,
          },
        },
        {
          provide: SocketService,
          useValue: {
            onAccountDeletionRequestResolved: () => EMPTY,
            onJoinRequestResolved: () => EMPTY,
          },
        },
        {
          provide: GroupService,
          useValue: {
            getGroupByName: vi.fn(() =>
              of({
                ok: true,
                group: {
                  groupName: 'Readers',
                  groupDescription: 'Books',
                  minAge: 18,
                  themeColor: 'light',
                  admins: ['ada'],
                  members: ['ada', 'bea'],
                  rooms: ['Main Room'],
                },
              })
            ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Chat);
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('does not send a message that contains an external link', () => {
    const component = fixture.componentInstance;
    component.newMessageContent = 'see http://example.com';

    component.sendContent();

    expect(sendMessage).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('External links are not allowed');
  });

  it('sends a plain text message', () => {
    const component = fixture.componentInstance;
    component.newMessageContent = 'hello back';

    component.sendContent();

    expect(sendMessage).toHaveBeenCalledWith({
      groupName: 'Readers',
      roomName: 'Main Room',
      senderUserName: 'ada',
      content: 'hello back',
      imageUrl: undefined,
    });
  });

  it('renders the room history with the sender display name', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('bea');
    expect(text).toContain('hello room');
  });
});
