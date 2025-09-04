import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HeartReactionComponent, Post } from './heart-reaction.component';
import { ReactionService } from '../../services/reaction.service';

describe('HeartReactionComponent', () => {
  let component: HeartReactionComponent;
  let fixture: ComponentFixture<HeartReactionComponent>;
  let mockReactionService: jasmine.SpyObj<ReactionService>;

  const mockPost: Post = {
    id: 1,
    title: 'Test Post',
    content: 'Test content',
    total_reactions: 5
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ReactionService', [
      'isAuthenticated',
      'toggleHeartReaction',
      'getUserReaction',
      'getReactionUsers',
      'getPostReactions',
      'reactionUpdates$'
    ]);

    await TestBed.configureTestingModule({
      imports: [HeartReactionComponent],
      providers: [
        { provide: ReactionService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeartReactionComponent);
    component = fixture.componentInstance;
    mockReactionService = TestBed.inject(ReactionService) as jasmine.SpyObj<ReactionService>;
    
    component.post = mockPost;
    mockReactionService.reactionUpdates$ = of(null);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct values', () => {
    mockReactionService.isAuthenticated.and.returnValue(true);
    mockReactionService.getUserReaction.and.returnValue(of({
      success: true,
      data: {
        hasReaction: true,
        reactionType: 'heart'
      }
    }));
    
    component.ngOnInit();
    
    expect(component.isAuthenticated).toBe(true);
    expect(component.reactionCount).toBe(5);
  });

  it('should toggle reaction when authenticated', async () => {
    mockReactionService.isAuthenticated.and.returnValue(true);
    mockReactionService.toggleHeartReaction.and.returnValue(of({
      success: true,
      data: {
        action: 'added',
        reactionType: 'heart'
      }
    }));
    
    await component.toggleReaction();
    
    expect(mockReactionService.toggleHeartReaction).toHaveBeenCalledWith(1);
  });

  it('should not toggle reaction when not authenticated', async () => {
    mockReactionService.isAuthenticated.and.returnValue(false);
    
    await component.toggleReaction();
    
    expect(mockReactionService.toggleHeartReaction).not.toHaveBeenCalled();
  });

  it('should handle reaction toggle error', async () => {
    mockReactionService.isAuthenticated.and.returnValue(true);
    mockReactionService.toggleHeartReaction.and.returnValue(throwError(() => new Error('API Error')));
    
    spyOn(window, 'alert');
    
    await component.toggleReaction();
    
    expect(window.alert).toHaveBeenCalledWith('Failed to update reaction. Please try again.');
  });
});