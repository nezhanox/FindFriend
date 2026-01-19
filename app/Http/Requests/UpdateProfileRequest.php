<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique('users')->ignore($this->user()->getKey()),
            ],
            'avatar' => ['nullable', 'image', 'max:2048'], // 2MB max
            'age' => ['nullable', 'integer', 'min:18', 'max:120'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other'])],
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => "ім'я",
            'email' => 'email',
            'avatar' => 'аватар',
            'age' => 'вік',
            'gender' => 'стать',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => "Ім'я обов'язкове",
            'email.required' => 'Email обов\'язковий',
            'email.email' => 'Email має бути валідним',
            'email.unique' => 'Цей email вже використовується',
            'avatar.image' => 'Аватар має бути зображенням',
            'avatar.max' => 'Аватар не може бути більше 2MB',
            'age.min' => 'Вік має бути не менше 18',
            'age.max' => 'Вік має бути не більше 120',
            'gender.in' => 'Невалідне значення статі',
        ];
    }
}
