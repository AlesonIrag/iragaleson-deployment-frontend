import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should block non-numeric keys in student ID input', () => {
    const keyboardEvent = new KeyboardEvent('keydown', { key: 'a' });
    spyOn(keyboardEvent, 'preventDefault');

    component.onStudentIdKeydown(keyboardEvent);

    expect(keyboardEvent.preventDefault).toHaveBeenCalled();
  });

  it('should allow numeric keys in student ID input', () => {
    const keyboardEvent = new KeyboardEvent('keydown', { key: '5' });
    spyOn(keyboardEvent, 'preventDefault');

    component.onStudentIdKeydown(keyboardEvent);

    expect(keyboardEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should allow navigation keys in student ID input', () => {
    const keyboardEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
    spyOn(keyboardEvent, 'preventDefault');

    component.onStudentIdKeydown(keyboardEvent);

    expect(keyboardEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should format student ID with dash after 4 digits', () => {
    const input = document.createElement('input');
    input.value = '123456789';

    const event = { target: input } as unknown as Event;
    component.onStudentIdInput(event);

    expect(input.value).toBe('1234-56789');
  });

  it('should prevent paste of non-numeric content', () => {
    const input = document.createElement('input');
    const clipboardEvent = new ClipboardEvent('paste');
    Object.defineProperty(clipboardEvent, 'clipboardData', {
      value: {
        getData: () => 'abc123def456'
      }
    });
    Object.defineProperty(clipboardEvent, 'target', { value: input });

    spyOn(clipboardEvent, 'preventDefault');

    component.onStudentIdPaste(clipboardEvent);

    expect(clipboardEvent.preventDefault).toHaveBeenCalled();
    expect(input.value).toBe('1234-56');
  });

  it('should show required error when student ID is empty', () => {
    const input = document.createElement('input');
    input.id = 'studentId';
    const errorDiv = document.createElement('div');
    errorDiv.id = 'studentIdError';
    errorDiv.classList.add('hidden');

    // Mock DOM methods
    spyOn(document, 'getElementById').and.callFake((id: string) => {
      if (id === 'studentIdError') return errorDiv;
      return null;
    });

    input.value = '';
    component.validateStudentId(input);

    expect(input.classList.contains('border-red-500')).toBe(true);
    expect(errorDiv.classList.contains('hidden')).toBe(false);
    expect(errorDiv.textContent).toBe('Student ID is required!');
  });

  it('should show format error when student ID has invalid format', () => {
    const input = document.createElement('input');
    input.id = 'studentId';
    const errorDiv = document.createElement('div');
    errorDiv.id = 'studentIdError';
    errorDiv.classList.add('hidden');

    // Mock DOM methods
    spyOn(document, 'getElementById').and.callFake((id: string) => {
      if (id === 'studentIdError') return errorDiv;
      return null;
    });

    input.value = '123';
    component.validateStudentId(input);

    expect(input.classList.contains('border-red-500')).toBe(true);
    expect(errorDiv.classList.contains('hidden')).toBe(false);
    expect(errorDiv.textContent).toBe('Student ID must be exactly 9 digits (format: 2000-00000)');
  });
});
