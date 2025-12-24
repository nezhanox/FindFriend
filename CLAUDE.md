# AI Agent Guidelines (Optimized)

## Stack
- PHP 8.2, Laravel 12, Inertia v2, React 19, Vite 7
- Pest 4, Pint, TypeScript, Tailwind 4

## Project Architecture

### Directory Structure
```
app/
├── Actions/           # Business logic (Laravel Actions)
├── Data/              # DTOs
├── Enums/             # Enumerations (TitleCase keys)
├── Http/
│   ├── Controllers/   # Thin controllers
│   └── Requests/      # Form validation
├── Models/            # Eloquent models with PHPDoc
├── Observers/         # Model observers
└── Support/           # Helpers, utilities

resources/js/
├── Components/        # Reusable React components
├── Layouts/           # Page layouts
└── Pages/             # Inertia pages

tests/
├── Feature/           # Integration tests (main focus)
├── Unit/              # Unit tests (custom logic only)
└── Browser/           # Pest v4 browser tests
```

### Domain Organization
- Features grouped by domain (Auth, UserPrograms, etc.)
- Each domain has Actions, Models, Tests
- No circular dependencies

## Docker Commands
```bash
# Setup
cp .env.example .env && docker compose up -d
docker compose exec app composer install && yarn install
docker compose exec app php artisan key:generate && php artisan migrate

# Dev
composer run dev  # Octane + queue + logs + Vite
```

## Code Rules

### PHP
- `declare(strict_types=1)` mandatory
- Full type hints
- `===` instead of `==`
- `$model->getKey()` instead of `$model->id`
- Eloquent: `query()`, `with()`, `withCount()`
- Constructor property promotion

### Models (Critical)
**ALL models MUST have complete PHPDoc blocks:**
```php
/**
 * App\Models\AreaTranslation
 *
 * @property int $id
 * @property string $title
 * @property Area|null $area
 * @method static Builder|self newModelQuery()
 * @method static Builder|self newQuery()
 * @method static Builder|self query()
 * @method static Builder|self whereId($value)
 * @method static Builder|self whereAreaId($value)
 * @method static Builder|self whereTitle($value)
 * @mixin Eloquent
 */
class AreaTranslation extends Model
{
    // Implementation
}
```

**Model Rules:**
- Document ALL properties (@property)
- Document ALL relationships with nullable types where appropriate
- Document query methods (@method static)
- Include @mixin Eloquent
- Use IDE helper: `php artisan ide-helper:models`
- Use `getKey()` instead of `id`
- Use `query()` for queries
- Relationships: return type hints required

### Laravel 12
- `bootstrap/app.php` for middleware/exceptions
- `routes/console.php` for commands
- Casts in `casts()` method
- `config('key')` instead of `env('KEY')`

### Architecture
- Laravel Actions for business logic
- Form Requests for validation
- Factories + Seeders for models
- Repository pattern via Eloquent

## Testing (Pest 4)

### Philosophy
- Tests prove functionality - no verification scripts needed
- Feature tests > Unit tests
- Test business logic, not framework
- Every change MUST have tests

### Running
```bash
docker compose exec app ./vendor/bin/pest --filter=testName
docker compose exec app ./vendor/bin/pest --mutate --covered-only --parallel --min=100
```

### What NOT to Test (Models)
**NEVER create unit tests for:**
- Basic CRUD operations
- Standard relationships (hasMany, belongsTo, etc.)
- Simple accessors/mutators without business logic
- Factory creation without custom logic
- Fillable/guarded attributes
- Standard casting
- Eloquent's built-in functionality

**Rationale:** Laravel extensively tests Eloquent. Testing it wastes time.

### What TO Test
**Models (exceptions only):**
- Custom business logic methods
- Complex accessors/mutators with rules
- Custom scopes with specific logic
- Observer behavior and side effects

**Focus on:**
- Feature tests via HTTP endpoints
- Integration tests for workflows
- Action/Service business logic
- Happy paths, failure paths, edge cases

### Test Structure
```php
<?php

declare(strict_types=1);

// Mutation testing (optional)
mutates(YourClass::class);

describe('Feature Description', function (): void {
    beforeEach(function (): void {
        $this->user = User::factory()->create();
    });

    it('describes what it tests', function (): void {
        $result = someFunction();

        expect($result)->toBe('expected_value');
    });
    
    it('handles validation errors', function (): void {
        $response = $this->postJson('/api/endpoint', []);
        
        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['field']);
    });
});
```

### Best Practices
- Use `assertSuccessful()`, `assertForbidden()` instead of `assertStatus(403)`
- Use factories with states
- RefreshDatabase trait for clean state
- Datasets for repeated test data
- Mock when appropriate (`use function Pest\Laravel\mock;`)
- Test authentication/authorization
- Test N+1 query prevention

## Inertia v2
- Pages in `resources/js/Pages`
- `Inertia::render('Users/Index', ['users' => User::all()])`
- Deferred props with skeleton states
- `useForm` helper for forms

## React/Frontend
- Radix UI components
- Tailwind 4 utility classes
- ESLint + Prettier
- TypeScript strict mode

## Quality Tools
```bash
./vendor/bin/pint          # Fix formatting
./vendor/bin/phpstan       # Static analysis
```

## Migrations
- Every DB change → new migration
- When modifying column specify all attributes

## Laravel Boost (MCP)
- `list-artisan-commands` - list commands
- `tinker` - debug PHP/Eloquent
- `database-query` - read DB
- `search-docs` - Laravel ecosystem docs
- `get-absolute-url` - correct URLs

## Forbidden
- Debugging functions in production
- Direct `->id` access
- `DB::` instead of Eloquent
- Models without tests for custom logic
- `env()` outside config files
- Empty `__construct()`
- Unit tests for standard Eloquent functionality

## Best Practices

### Code Organization
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Descriptive naming: `isRegisteredForDiscounts` not `discount()`
- Check sibling files for conventions
- Reuse existing components

### Controllers
- Keep thin - delegate to Actions
- No business logic in controllers
- Use Form Requests for validation
- Return types on all methods

### Database
- Eager load to prevent N+1 queries
- Use relationship methods over joins
- Index foreign keys and frequently queried columns
- Soft deletes when appropriate
- Migrations: all column attributes on modify

### Security
- Always validate input (Form Requests)
- Authorization checks (Gates/Policies)
- CSRF protection (built-in)
- SQL injection prevention (use Eloquent/Query Builder)
- XSS prevention (Blade escaping)

### Performance
- Cache expensive queries
- Queue time-consuming operations
- Optimize eager loading
- Use chunk() for large datasets
- Database indexing

### Code Quality
**Cognitive Complexity Limits:**
- Class: max 85
- Function: max 8

**Tools (run before commit):**
```bash
./vendor/bin/pint              # Auto-fix formatting
./vendor/bin/phpstan analyse   # Static analysis level 5
```

### Documentation
- PHPDoc blocks on classes and methods
- Array shape definitions where useful
- No inline comments unless complex logic
- Self-documenting code preferred

### Git Workflow
1. Create feature branch
2. Write failing test
3. Implement feature
4. Run tests (`--filter` for speed)
5. Run Pint
6. Run PHPStan
7. Commit with descriptive message
8. Run full test suite before PR